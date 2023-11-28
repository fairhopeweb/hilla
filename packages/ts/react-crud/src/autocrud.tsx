import type { AbstractModel, DetachedModelConstructor, Value } from '@hilla/form';
import { Button } from '@hilla/react-components/Button.js';
import { SplitLayout } from '@hilla/react-components/SplitLayout';
import { type JSX, useState } from 'react';
import { AutoCrudDialog } from './autocrud-dialog';
import css from './autocrud.obj.css';
import { type AutoFormProps, emptyItem, AutoForm } from './autoform.js';
import { AutoGrid, type AutoGridProps } from './autogrid.js';
import type { CrudService } from './crud.js';
import { useMediaQuery } from './media-query';
import { type ComponentStyleProps, registerStylesheet } from './util';

registerStylesheet(css);

export type AutoCrudFormProps<TModel extends AbstractModel> = Omit<
  Partial<AutoFormProps<TModel>>,
  'disabled' | 'item' | 'model' | 'onDeleteSuccess' | 'onSubmitSuccess' | 'service'
>;

export type AutoCrudGridProps<TItem> = Omit<
  Partial<AutoGridProps<TItem>>,
  'model' | 'onActiveItemChanged' | 'refreshTrigger' | 'selectedItems' | 'service'
>;

export type AutoCrudProps<TModel extends AbstractModel = AbstractModel> = ComponentStyleProps &
  Readonly<{
    /**
     * The service to use for fetching the data, as well saving and deleting
     * items. This must be a TypeScript service that has been generated by Hilla
     * from a backend Java service that implements the
     * `dev.hilla.crud.CrudService` interface.
     */
    service: CrudService<Value<TModel>>;
    /**
     * The entity model to use for the CRUD. This determines which columns to
     * show in the grid, and which fields to show in the form. This must be a
     * Typescript model class that has been generated by Hilla from a backend
     * Java class. The model must match with the type of the items returned by
     * the service. For example, a `PersonModel` can be used with a service that
     * returns `Person` instances.
     *
     * By default, the grid shows columns for all properties of the model which
     * have a type that is supported. Use the `gridProps.visibleColumns` option
     * to customize which columns to show and in which order.
     *
     * By default, the form shows fields for all properties of the model which
     * have a type that is supported. Use the `formProps.visibleFields`
     * option to customize which fields to show and in which order.
     */
    model: DetachedModelConstructor<TModel>;
    /**
     * The property to use to detect an item's ID. The item ID is required for
     * deleting items via the `CrudService.delete` method as well as keeping the
     * selection state after reloading the grid.
     *
     * By default, the component uses the property annotated with
     * `jakarta.persistence.Id`, or a property named `id`, in that order.
     * This option can be used to override the default behavior, or define the ID
     * property in case a class doesn't have a property matching the defaults.
     */
    itemIdProperty?: string;
    /**
     * Props to pass to the form. See the `AutoForm` component for details.
     */
    formProps?: AutoCrudFormProps<TModel>;
    /**
     * Props to pass to the grid. See the `AutoGrid` component for details.
     */
    gridProps?: AutoCrudGridProps<Value<TModel>>;
  }>;

/**
 * Auto CRUD is a component that provides CRUD (create, read, update, delete)
 * functionality based on a Java backend service. It automatically generates a
 * grid that shows data from the service, and a form for creating, updating and
 * deleting items.
 *
 * Example usage:
 * ```tsx
 * import { AutoCrud } from '@hilla/react-crud';
 * import PersonService from 'Frontend/generated/endpoints';
 * import PersonModel from 'Frontend/generated/com/example/application/Person';
 *
 * <AutoCrud service={PersonService} model={PersonModel} />
 * ```
 */
export function AutoCrud<TModel extends AbstractModel>({
  service,
  model,
  itemIdProperty,
  formProps,
  gridProps,
  style,
  id,
  className,
}: AutoCrudProps<TModel>): JSX.Element {
  const [item, setItem] = useState<Value<TModel> | typeof emptyItem | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fullScreen = useMediaQuery('(max-width: 600px), (max-height: 600px)');

  function refreshGrid() {
    setRefreshTrigger(refreshTrigger + 1);
  }

  function handleCancel() {
    setItem(undefined);
  }

  const mainSection = (
    <div className="auto-crud-main">
      <AutoGrid
        {...gridProps}
        refreshTrigger={refreshTrigger}
        service={service}
        model={model as DetachedModelConstructor<AbstractModel<Value<TModel>>>}
        itemIdProperty={itemIdProperty}
        selectedItems={item && item !== emptyItem ? [item] : []}
        onActiveItemChanged={(e) => {
          const activeItem = e.detail.value;
          setItem(activeItem ?? undefined);
        }}
      ></AutoGrid>
      <div className="auto-crud-toolbar">
        <Button theme="primary" onClick={() => setItem(emptyItem)}>
          + New
        </Button>
      </div>
    </div>
  );

  const autoForm = (
    <AutoForm
      deleteButtonVisible={true}
      {...formProps}
      disabled={!item}
      service={service}
      model={model}
      itemIdProperty={itemIdProperty}
      item={item}
      onSubmitSuccess={({ item: submittedItem }) => {
        if (fullScreen) {
          setItem(undefined);
        } else {
          setItem(submittedItem);
        }
        refreshGrid();
      }}
      onDeleteSuccess={() => {
        setItem(undefined);
        refreshGrid();
      }}
    />
  );

  return (
    <div className={`auto-crud ${className ?? ''}`} id={id} style={style}>
      {fullScreen ? (
        <>
          {mainSection}
          <AutoCrudDialog opened={!!item} onClose={handleCancel}>
            {autoForm}
          </AutoCrudDialog>
        </>
      ) : (
        <SplitLayout theme="small">
          {mainSection}
          {autoForm}
        </SplitLayout>
      )}
    </div>
  );
}
